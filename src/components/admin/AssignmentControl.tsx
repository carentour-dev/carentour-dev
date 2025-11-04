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
import { useTeamMembers } from "@/components/admin/hooks/useTeamMembers";

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
                    >
                      <div className="flex items-center gap-2 text-foreground">
                        <X className="h-4 w-4 opacity-50" />
                        <span>Unassigned</span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          assigneeId === null ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  )}
                  {filteredMembers.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={member.id}
                      onSelect={() => {
                        onAssign(member.id);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {member.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {member.jobTitle ??
                            member.email ??
                            member.roles.join(", ")}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          member.id === assigneeId
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
