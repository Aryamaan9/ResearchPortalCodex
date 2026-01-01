import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface TaskItem {
  id: string;
  title: string;
  status: "pending" | "in-progress" | "done";
  assignee: string;
  dueDate: string;
}

export function TasksTracker() {
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: "task-1", title: "Review Q3 results for Stratos", status: "pending", assignee: "Analyst 1", dueDate: "2025-01-30" },
    { id: "task-2", title: "Update Medora payer mix model", status: "in-progress", assignee: "Analyst 2", dueDate: "2025-02-05" },
  ]);
  const [draftTitle, setDraftTitle] = useState("");

  const addTask = () => {
    if (!draftTitle.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: `task-${Date.now()}`,
        title: draftTitle,
        status: "pending",
        assignee: "Unassigned",
        dueDate: new Date().toISOString().slice(0, 10),
      },
    ]);
    setDraftTitle("");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Research Tasks</h1>
          <p className="text-muted-foreground text-sm">Assign owners, due dates, and status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="text-base">To-Do Tracker</CardTitle>
              <p className="text-muted-foreground text-sm">Lightweight list to capture research work.</p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="New research task"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-56"
              />
              <Button onClick={addTask}>Add</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="border rounded-md p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{task.title}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="capitalize">{task.status}</Badge>
                      <span>{task.assignee}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Due {task.dueDate}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="font-semibold text-sm text-red-700">Price Alert</p>
              <p className="text-xs text-muted-foreground">Key coverage stock moved -3% intraday.</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
              <p className="font-semibold text-sm text-purple-700">Results Due</p>
              <p className="text-xs text-muted-foreground">Upcoming earnings call this week.</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="font-semibold text-sm text-green-700">Screen Match</p>
              <p className="text-xs text-muted-foreground">Two new names meet screen criteria.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
