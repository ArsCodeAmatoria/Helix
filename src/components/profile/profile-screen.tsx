"use client";

import Link from "next/link";
import { Award, ClipboardCheck, Phone, Users } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export function ProfileScreen() {
  const worker = db.worker;
  const company = db.company;
  const initials = worker.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div>
      <PageHeader title="Profile" subtitle={company.name} />
      <main className="space-y-5 px-4 py-5">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Avatar className="size-16">
              <AvatarFallback className="bg-sky-600 text-lg font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{worker.name}</h2>
              <p className="text-sm text-muted-foreground">
                #{worker.employeeNumber} · {worker.trade}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="size-4" />
              Continuous evaluations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Rigger pathway (Basics → Intermediate → Advanced) and site lift
              sign-offs — concrete day, tables, Doka cart, gang forms, core
              lifts. Supervisors review and sign as you qualify.
            </p>
            <Button asChild className="h-12 w-full rounded-2xl font-semibold">
              <Link href="/evaluations/member/m-chen">My competency profile</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 w-full rounded-2xl font-semibold"
            >
              <Link href="/evaluations">All pathways &amp; workers</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" />
              Crew & supervision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Crew</span>
              <span className="font-medium text-right">{worker.crew}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Supervisor</span>
              <span className="font-medium text-right">{worker.supervisor}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Default role</span>
              <span className="font-medium text-right">{worker.defaultRole}</span>
            </div>
            <Button asChild className="mt-2 h-12 w-full rounded-2xl font-semibold">
              <Link href="/team">Manage My Team</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="size-4" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {worker.certifications.map((c) => (
              <Badge key={c} variant="secondary" className="rounded-full px-3 py-1.5">
                {c}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="size-4" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Mobile: </span>
              {worker.phone}
            </p>
            <p>
              <span className="text-muted-foreground">Company: </span>
              {company.phone}
            </p>
            <p className="text-muted-foreground">{company.address}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Qualified roles</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {worker.roles.map((r) => (
              <Badge
                key={r}
                variant={r === worker.defaultRole ? "default" : "outline"}
                className="rounded-full px-3 py-1.5"
              >
                {r}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
