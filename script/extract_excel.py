#!/usr/bin/env python3
import csv
import datetime as dt
import importlib
import io
import json
import os
import sys
import zipfile
from typing import List, Dict, Any


def format_cell_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (dt.datetime, dt.date)):
        return value.isoformat()
    return str(value)


def serialize_rows(rows) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    comments: List[str] = []

    for row in rows:
        serialized_row: List[str] = []
        for cell in row:
            if getattr(cell, "comment", None):
                comments.append(f"[Comment at {cell.coordinate}]: {cell.comment.text}")
            serialized_row.append(format_cell_value(getattr(cell, "value", None)))
        writer.writerow(serialized_row)

    if comments:
        writer.writerow([])
        for comment in comments:
            writer.writerow([comment])

    return buffer.getvalue()


def ensure_module(module_name: str, friendly_name: str):
    spec = importlib.util.find_spec(module_name)
    if spec is None:
        raise ImportError(f"{friendly_name} is required to parse this workbook.")
    return importlib.import_module(module_name)


def parse_xlsx(file_path: str) -> List[Dict[str, Any]]:
    openpyxl = ensure_module("openpyxl", "openpyxl")
    workbook = openpyxl.load_workbook(filename=file_path, data_only=True, read_only=False)
    sheets: List[Dict[str, Any]] = []

    for worksheet in workbook.worksheets:
        try:
            text = serialize_rows(worksheet.iter_rows())
            image_count = len(getattr(worksheet, "_images", []))
            chart_count = len(getattr(worksheet, "_charts", []))
            placeholders: List[str] = []

            if image_count:
                placeholders.append(f"[{image_count} image(s) attached to this sheet]")
            if chart_count:
                placeholders.append(f"[{chart_count} chart(s) attached to this sheet]")

            if placeholders:
                text = f"{text}\n" + "\n".join(placeholders) + "\n"

            sheets.append({"name": worksheet.title, "text": text})
        except Exception as sheet_err:  # noqa: BLE001
            sheets.append({"name": worksheet.title, "error": str(sheet_err)})

    workbook.close()
    return sheets


def parse_xls(file_path: str) -> List[Dict[str, Any]]:
    sheets: List[Dict[str, Any]] = []
    if importlib.util.find_spec("xlrd"):
        xlrd = importlib.import_module("xlrd")
        workbook = xlrd.open_workbook(file_path)
        for sheet in workbook.sheets():
            try:
                buffer = io.StringIO()
                writer = csv.writer(buffer)
                for row_idx in range(sheet.nrows):
                    row_values = [sheet.cell_value(row_idx, col) for col in range(sheet.ncols)]
                    writer.writerow([format_cell_value(value) for value in row_values])
                sheets.append({"name": sheet.name, "text": buffer.getvalue()})
            except Exception as sheet_err:  # noqa: BLE001
                sheets.append({"name": sheet.name, "error": str(sheet_err)})
        return sheets

    if importlib.util.find_spec("pyexcel_xls"):
        pyexcel_xls = importlib.import_module("pyexcel_xls")
        workbook_data = pyexcel_xls.get_data(file_path)
        for name, rows in workbook_data.items():
            try:
                buffer = io.StringIO()
                writer = csv.writer(buffer)
                for row in rows:
                    writer.writerow([format_cell_value(value) for value in row])
                sheets.append({"name": name, "text": buffer.getvalue()})
            except Exception as sheet_err:  # noqa: BLE001
                sheets.append({"name": name, "error": str(sheet_err)})
        return sheets

    raise ImportError("Neither xlrd nor pyexcel_xls is available for legacy XLS files.")


def parse_csv(file_path: str) -> List[Dict[str, Any]]:
    with open(file_path, newline="", encoding="utf-8", errors="replace") as csv_file:
        reader = csv.reader(csv_file)
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        for row in reader:
            writer.writerow([format_cell_value(value) for value in row])
    return [{"name": os.path.basename(file_path) or "CSV", "text": buffer.getvalue()}]


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No workbook path provided.", "sheets": []}))
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"error": f"File does not exist: {file_path}", "sheets": []}))
        sys.exit(1)

    _, ext = os.path.splitext(file_path.lower())

    try:
        if ext == ".csv":
            sheets = parse_csv(file_path)
        elif zipfile.is_zipfile(file_path):
            sheets = parse_xlsx(file_path)
        else:
            sheets = parse_xls(file_path)
        output = {"sheets": sheets}
    except Exception as err:  # noqa: BLE001
        output = {"error": str(err), "sheets": []}

    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    main()
