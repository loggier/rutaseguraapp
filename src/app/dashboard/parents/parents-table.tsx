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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserCheck, UserX, Trash2, KeyRound, Edit } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";
import { UpdateStatusAlert } from "../users/update-status-alert";
import { DeleteUserAlert } from "../users/delete-user-alert";
import { ChangePasswordDialog } from "../users/change-password-dialog";
import { EditParentDialog } from "./edit-parent-dialog";

type ParentsTableProps = {
    profiles: Profile[];
    onParentUpdated: (updatedUser: Profile) => void;
    onParentStatusChanged: (userId: string, newStatus: boolean) => void;
    onParentDeleted: (userId: string) => void;
}

export function ParentsTable({ profiles, onParentUpdated, onParentStatusChanged, onParentDeleted }: ParentsTableProps) {
    const [userToUpdateStatus, setUserToUpdateStatus] = useState<Profile | null>(null);
    const [userToChangePassword, setUserToChangePassword] = useState<Profile | null>(null);
    const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

    return (
        <>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Estado</TableHead>
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
                    <TableCell className="text-sm text-muted-foreground">
                        <div>{profile.telefono || 'Sin teléfono'}</div>
                        <div>{profile.direccion || 'Sin dirección'}</div>
                    </TableCell>
                     <TableCell>
                        <Badge variant={profile.activo ? 'default' : 'secondary'}>
                          {profile.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </TableCell>
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
                            <EditParentDialog user={profile} onUserUpdated={onParentUpdated}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                            </EditParentDialog>
                            <DropdownMenuItem onClick={() => setUserToChangePassword(profile)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Cambiar Contraseña
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setUserToUpdateStatus(profile)}>
                                {profile.activo ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                {profile.activo ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className='text-destructive'
                                onClick={() => setUserToDelete(profile)}
                            >
                               <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
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
                    onUserStatusChanged={onParentStatusChanged}
                />
            )}

            {userToChangePassword && (
                <ChangePasswordDialog
                    user={userToChangePassword}
                    isOpen={!!userToChangePassword}
                    onClose={() => setUserToChangePassword(null)}
                />
            )}

            {userToDelete && (
                <DeleteUserAlert
                    user={userToDelete}
                    isOpen={!!userToDelete}
                    onClose={() => setUserToDelete(null)}
                    onUserDeleted={onParentDeleted}
                />
            )}
        </>
    );
}
