"use client";

import { useState } from "react";
import {
  Download,
  Plus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FilterBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const sampleRows = [
  {
    id: "1",
    name: "Alice Mukamana",
    district: "Gasabo",
    status: "Active" as const,
    visits: 4,
  },
  {
    id: "2",
    name: "Eric Niyonsenga",
    district: "Kicukiro",
    status: "Overdue" as const,
    visits: 0,
  },
  {
    id: "3",
    name: "Claudine Uwera",
    district: "Nyarugenge",
    status: "Due soon" as const,
    visits: 1,
  },
];

export default function DesignSystemPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = sampleRows.filter((row) =>
    row.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Design system"
        description="Phase 1 UI kit and composites. Use these patterns across all SAMU modules."
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => toast.message("Export queued (demo)")}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              type="button"
              onClick={() =>
                toast.success("Primary action", {
                  description: "Toast provider is working.",
                })
              }
            >
              <Plus className="h-4 w-4" />
              Primary action
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Agents" value="1,284" icon={Users} context="Across territories" />
        <KpiCard
          title="Compliance"
          value="92%"
          trend={{ direction: "up", label: "+2.1%" }}
        />
        <KpiCard
          title="Overdue"
          value="18"
          trend={{ direction: "down", label: "Improving" }}
        />
        <KpiCard
          title="Visits"
          value="246"
          trend={{ direction: "flat", label: "Stable" }}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Status badges</CardTitle>
          <CardDescription>Color plus label — never color alone.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <StatusBadge label="Active" tone="success" />
          <StatusBadge label="Due soon" tone="warning" />
          <StatusBadge label="Overdue" tone="danger" />
          <StatusBadge label="Scheduled" tone="info" />
          <StatusBadge label="Pending" tone="neutral" />
          <StatusBadge label="Inactive" tone="inactive" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buttons & controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button type="button">Default</Button>
            <Button type="button" variant="secondary">
              Secondary
            </Button>
            <Button type="button" variant="outline">
              Outline
            </Button>
            <Button type="button" variant="ghost">
              Ghost
            </Button>
            <Button type="button" variant="navy">
              Navy
            </Button>
            <Button type="button" variant="destructive">
              Destructive
            </Button>
            <Button type="button" variant="link">
              Link button
            </Button>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ds-name">Full name</Label>
              <Input id="ds-name" placeholder="Enter name" />
            </div>
            <div className="space-y-2">
              <Label>District</Label>
              <Select defaultValue="gasabo">
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasabo">Gasabo</SelectItem>
                  <SelectItem value="kicukiro">Kicukiro</SelectItem>
                  <SelectItem value="nyarugenge">Nyarugenge</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ds-notes">Notes</Label>
              <Textarea id="ds-notes" placeholder="Optional notes" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox id="ds-check" defaultChecked />
              Ready for visit
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Switch id="ds-switch" />
              SMS confirmation
            </label>
            <RadioGroup defaultValue="a" className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="a" id="r1" />
                Option A
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="b" id="r2" />
                Option B
              </label>
            </RadioGroup>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="secondary">
                  Open dialog
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm action</DialogTitle>
                  <DialogDescription>
                    Dialogs use SAMU surface tokens and require clear primary actions.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                  <Button type="button">Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline">
                  Dropdown
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View profile</DropdownMenuItem>
                <DropdownMenuItem>Export row</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon">
                    <Users className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Assigned agents</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Avatar>
              <AvatarFallback>JU</AvatarFallback>
            </Avatar>
            <Badge>Default badge</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Data table</TabsTrigger>
          <TabsTrigger value="states">States</TabsTrigger>
          <TabsTrigger value="loading">Loading</TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="space-y-4">
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search agents…"
            actions={
              <Button type="button" size="sm">
                <Plus className="h-4 w-4" />
                New agent
              </Button>
            }
          />
          <DataTable
            data={filtered}
            getRowId={(row) => row.id}
            page={page}
            pageSize={10}
            total={filtered.length}
            onPageChange={setPage}
            columns={[
              {
                id: "name",
                header: "Agent",
                cell: (row) => row.name,
              },
              {
                id: "district",
                header: "District",
                cell: (row) => row.district,
              },
              {
                id: "status",
                header: "Status",
                cell: (row) => (
                  <StatusBadge
                    label={row.status}
                    tone={
                      row.status === "Active"
                        ? "success"
                        : row.status === "Overdue"
                          ? "danger"
                          : "warning"
                    }
                  />
                ),
              },
              {
                id: "visits",
                header: "Visits",
                align: "right",
                cell: (row) => row.visits,
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="states" className="grid gap-4 lg:grid-cols-2">
          <EmptyState
            title="No agents found"
            description="Adjust filters or create a new agent record."
            action={<Button type="button">Create agent</Button>}
          />
          <ErrorState
            onRetry={() => toast.message("Retry clicked")}
          />
          <div className="lg:col-span-2">
            <PermissionDenied />
          </div>
        </TabsContent>
        <TabsContent value="loading" className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
