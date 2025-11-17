"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, UserRoundPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useTeamMembers,
  type TeamMember,
} from "@/components/admin/hooks/useTeamMembers";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
};

const getMemberDetails = (member: TeamMember) => {
  const detailParts = [
    member.email,
    member.roles.length ? member.roles.join(" • ") : null,
  ].filter(Boolean) as string[];
  return Array.from(new Set(detailParts)).join(" • ");
};

type AssignmentControlProps = {
  assigneeId: string | null;
  assigneeLabel?: string | null;
  assigneeDescription?: string | null;
  onAssign: (memberId: string | null) => Promise<void> | void;
  isPending?: boolean;
  disabled?: boolean;
  allowUnassign?: boolean;
  placeholder?: string;
};

export function AssignmentControl({
  assigneeId,
  assigneeLabel,
  assigneeDescription,
  onAssign,
  isPending = false,
  disabled = false,
  allowUnassign = true,
  placeholder = "Assign to…",
}: AssignmentControlProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const {
    data: members = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useTeamMembers();

  const filteredMembers = useMemo(() => {
    if (!search) return members;
    const lower = search.toLowerCase();
    return members.filter((member) => {
      const fields = [
        member.displayName,
        member.email ?? "",
        member.jobTitle ?? "",
        member.roles.join(" "),
      ];
      return fields.some((field) => field.toLowerCase().includes(lower));
    });
  }, [members, search]);

  const selectedMember =
    members.find((member) => member.id === assigneeId) ?? null;

  const currentLabel =
    assigneeLabel ??
    selectedMember?.displayName ??
    (assigneeId ? "Unknown assignee" : null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isPending || isFetching}
          className="flex items-center gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserRoundPlus className="h-4 w-4" />
          )}
          <span className="truncate">
            {currentLabel ?? placeholder}
            {assigneeDescription ? ` • ${assigneeDescription}` : ""}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search team members..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading team members…
              </div>
            ) : isError ? (
              <div className="space-y-3 p-4 text-sm">
                <p className="font-medium text-destructive">
                  {error instanceof Error
                    ? error.message
                    : "Failed to load team members."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="w-full"
                >
                  Try again
                </Button>
              </div>
            ) : (
              <>
                <CommandEmpty>No team members found.</CommandEmpty>
                <CommandGroup>
                  {allowUnassign && (
                    <CommandItem
                      value="__unassigned__"
                      onSelect={() => {
                        onAssign(null);
                        setOpen(false);
                      }}
                      className={cn(
                        "items-start rounded-lg border border-transparent px-3 py-3 text-left transition-colors",
                        "hover:border-muted hover:bg-muted/30",
                        "data-[selected=true]:border-primary/50 data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground",
                      )}
                    >
                      <div className="flex w-full items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                          <X className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-semibold text-foreground">
                            Unassigned
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Clear the current assignee
                          </p>
                        </div>
                        <Check
                          className={cn(
                            "h-4 w-4 text-primary transition-opacity",
                            assigneeId === null ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </div>
                    </CommandItem>
                  )}
                  {filteredMembers.map((member) => {
                    const primaryRole =
                      member.jobTitle ??
                      (member.roles.length > 0 ? member.roles[0] : null);
                    const secondaryDetails = getMemberDetails(member);
                    return (
                      <CommandItem
                        key={member.id}
                        value={member.id}
                        onSelect={() => {
                          onAssign(member.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "items-start rounded-lg border border-transparent px-3 py-3 text-left transition-colors",
                          "hover:border-muted hover:bg-muted/30",
                          "data-[selected=true]:border-primary/50 data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground",
                        )}
                      >
                        <div className="flex w-full items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              {member.avatarUrl ? (
                                <AvatarImage
                                  src={member.avatarUrl}
                                  alt={member.displayName}
                                />
                              ) : null}
                              <AvatarFallback>
                                {getInitials(member.displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <Check
                              className={cn(
                                "absolute -right-1 -bottom-1 h-4 w-4 rounded-full bg-primary p-0.5 text-primary-foreground transition-opacity",
                                member.id === assigneeId
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {member.displayName}
                              </span>
                              {primaryRole && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-semibold tracking-wide text-muted-foreground"
                                >
                                  {primaryRole}
                                </Badge>
                              )}
                            </div>
                            {secondaryDetails && (
                              <p className="text-sm text-muted-foreground">
                                {secondaryDetails}
                              </p>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
