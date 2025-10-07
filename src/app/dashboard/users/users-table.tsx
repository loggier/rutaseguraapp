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
import { MoreHorizontal, UserCheck, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";
import { EditUserDialog } from "./edit-user-dialog";
import { UpdateStatusAlert } from "./update-status-alert";

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
    onUserStatusChanged: (userId: string, newStatus: boolean) => void;
}

export function UsersTable({ profiles, onUserUpdated, onUserStatusChanged }: UsersTableProps) {
    const [userToUpdateStatus, setUserToUpdateStatus] = useState<Profile | null>(null);

    return (
        <>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden md:table-cell">ID de Usuario</TableHead>
                    <TableHead>
                    <span className="sr-only">Acciones</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {profiles.map((profile) => (
                    <TableRow key={profile.id} className={!profile.activo ? 'bg-muted/50' : ''}>
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
                     <TableCell>
                        <Badge variant={profile.activo ? 'default' : 'destructive'}>
                          {profile.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
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
                                className={profile.activo ? 'text-destructive' : 'text-green-600'}
                                disabled={profile.rol === 'master'}
                                onClick={() => setUserToUpdateStatus(profile)}
                            >
                                {profile.activo ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                {profile.activo ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            {userToUpdateStatus && (
                <UpdateStatusAlert
                    user={userToUpdateStatus}
                    isOpen={!!userToUpdateStatus}
                    onClose={() => setUserToUpdateStatus(null)}
                    onUserStatusChanged={onUserStatusChanged}
                />
            )}
        </>
    );
}
