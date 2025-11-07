import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async listMembers(): Promise<
    Array<{
      id: string;
      email: string;
      role: UserRole;
      createdAt: Date;
    }>
  > {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return users;
  }

  async invite(managerId: string, dto: InviteTeamMemberDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const desiredRole = dto.role ?? UserRole.MEDEWERKER;

    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { id: true, role: true },
    });
    if (!manager || manager.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen teamleden uitnodigen.');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          role: desiredRole,
        },
      });
    } else if (user.role !== desiredRole) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: desiredRole },
      });
    }

    await this.authService.requestPasswordReset({ email: normalizedEmail });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async updateMemberRole(managerId: string, userId: string, dto: UpdateTeamMemberDto) {
    if (managerId === userId) {
      throw new ForbiddenException('Je kunt je eigen rol niet aanpassen.');
    }

    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { role: true },
    });
    if (!manager || manager.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen rollen aanpassen.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Gebruiker niet gevonden.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    return updated;
  }

  async remove(managerId: string, userId: string) {
    if (managerId === userId) {
      throw new ForbiddenException('Je kunt jezelf niet verwijderen.');
    }

    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { role: true },
    });
    if (!manager || manager.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen teamleden verwijderen.');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
