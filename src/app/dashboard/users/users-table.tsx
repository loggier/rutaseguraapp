'use client';

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";
import { EditUserDialog } from "./edit-user-dialog";
import { DeleteUserAlert } from "./delete-user-alert";

function getRoleVariant(role: string | null) {
  switch (role) {
    case 'master':
      return 'destructive';
    case 'manager':
      return 'default';
    case 'colegio':
      return 'secondary';
    case 'padre':
      return 'outline';
    default:
      return 'outline';
  }
}

type UsersTableProps = {
    profiles: Profile[];
    onUserUpdated: (updatedUser: Profile) => void;
    onUserDeleted: (deletedUserId: string) => void;
}

export function UsersTable({ profiles, onUserUpdated, onUserDeleted }: UsersTableProps) {
    const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

    return (
        <>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="hidden md:table-cell">ID de Usuario</TableHead>
                    <TableHead>
                    <span className="sr-only">Acciones</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={profile.avatar_url || ''} alt={`${profile.nombre || ''} ${profile.apellido || ''}`} data-ai-hint="person face" />
                            <AvatarFallback>{(profile.nombre?.[0] || '')}{(profile.apellido?.[0] || '')}</AvatarFallback>
                        </Avatar>
                        <div>
                            {profile.nombre || 'Sin'} {profile.apellido || 'Nombre'}
                            <div className="text-sm text-muted-foreground">{profile.email}</div>
                        </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getRoleVariant(profile.rol)}>{profile.rol}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">{profile.id}</TableCell>
                    <TableCell>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <EditUserDialog user={profile} onUserUpdated={onUserUpdated}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    Editar Usuario
                                </DropdownMenuItem>
                            </EditUserDialog>
                            <DropdownMenuItem
                                className="text-destructive"
                                disabled={profile.rol === 'master'}
                                onClick={() => setUserToDelete(profile)}
                            >
                                Eliminar Usuario
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            {userToDelete && (
                <DeleteUserAlert
                    user={userToDelete}
                    isOpen={!!userToDelete}
                    onClose={() => setUserToDelete(null)}
                    onUserDeleted={onUserDeleted}
                />
            )}
        </>
    );
}
