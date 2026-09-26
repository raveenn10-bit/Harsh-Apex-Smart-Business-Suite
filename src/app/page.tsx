import * as React from "react";
import { HarshApexLogo } from "@/components/brand/HarshApexLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ShieldCheck, Zap, Layers, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50/60 dark:bg-slate-950 pb-20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <HarshApexLogo size="md" href="/" />
          <div className="flex items-center gap-3">
            <Badge variant="business">Commercial Suite v1.0</Badge>
            <Button variant="outline" size="sm">
              Documentation
            </Button>
            <Button variant="brand" size="sm">
              Launch Suite <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6">
        <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="premium" className="mb-2">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Enterprise SaaS Platform
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Harsh Apex{" "}
            <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Smart Business Suite
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Unified multi-tenant enterprise system with automated workflows,
            real-time operations, and multi-tier billing management.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-blue-400/50 transition-all">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 mb-2">
                <Layers className="h-5 w-5" />
              </div>
              <CardTitle>Multi-Tenant Architecture</CardTitle>
              <CardDescription>
                Isolated tenant workspaces with customized roles, permissions,
                and telemetry.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant="basic">Basic</Badge>
                <Badge variant="business">Business</Badge>
                <Badge variant="premium">Premium</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                Learn more <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:border-blue-400/50 transition-all">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mb-2">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Full RBAC permission control, audit logs, and secure database
                level isolation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant="success">Active</Badge>
                <Badge variant="info">Encrypted</Badge>
                <Badge variant="secondary">SOC2 Ready</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                Security whitepaper <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:border-blue-400/50 transition-all">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 mb-2">
                <Zap className="h-5 w-5" />
              </div>
              <CardTitle>Automated Workflows</CardTitle>
              <CardDescription>
                Event-driven processes, webhook integrations, and automated
                invoicing systems.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant="warning">High Throughput</Badge>
                <Badge variant="outline">Realtime</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                View pipelines <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Live UI Components Demonstration Table */}
        <div className="mt-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Active Organization Tenants
              </h2>
              <p className="text-sm text-muted-foreground">
                Design system table primitives with live data status badges
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Input
                placeholder="Filter tenants..."
                className="max-w-xs"
              />
              <Button variant="brand" size="sm">
                Add Tenant
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant Name</TableHead>
                  <TableHead>Subscription Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Seats Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-600 text-white font-bold">
                          HA
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Harsh Apex Corp
                        </div>
                        <div className="text-xs text-muted-foreground">
                          apex.suite.internal
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="premium">Premium Tier</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">Operational</Badge>
                  </TableCell>
                  <TableCell>148 / 200</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-indigo-600 text-white font-bold">
                          GL
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Global Logistics Ltd
                        </div>
                        <div className="text-xs text-muted-foreground">
                          logistics.apex.net
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="business">Business Tier</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">Operational</Badge>
                  </TableCell>
                  <TableCell>42 / 50</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-slate-700 text-white font-bold">
                          NV
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Nova Ventures Inc
                        </div>
                        <div className="text-xs text-muted-foreground">
                          nova.corp.apex
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="basic">Basic Tier</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="warning">Billing Pending</Badge>
                  </TableCell>
                  <TableCell>8 / 10</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </main>
  );
}
