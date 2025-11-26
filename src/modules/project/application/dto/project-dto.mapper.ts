import { Project } from '../../domain/model/project.model';
import { ProjectDetailDto } from './project.dto';
import { Goal } from '../../domain/model/goal.model';
import { GoalDetailDto } from './goal.dto';
import { Activity } from '../../domain/model/activity.model';
import { ActivityDetailDto } from './activity.dto';
import { Milestone } from '../../domain/model/milestone.model';
import { MilestoneDetailDto } from './milestone.dto';
import { ProjectTeamMember } from '../../domain/model/project-team-member.model';
import { ProjectTeamMemberDetailDto } from './project-team-member.dto';
import { Beneficiary } from '../../domain/model/beneficiary.model';
import { BeneficiaryDetailDto } from './beneficiary.dto';
import { ProjectRisk } from '../../domain/model/project-risk.model';
import { ProjectRiskDetailDto } from './project-risk.dto';

/**
 * Project DTO Mapper
 */
export class ProjectDtoMapper {
  static toDto(project: Project): ProjectDetailDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      code: project.code,
      category: project.category,
      status: project.status,
      phase: project.phase,
      startDate: project.startDate,
      endDate: project.endDate,
      actualEndDate: project.actualEndDate,
      budget: project.budget,
      spentAmount: project.spentAmount,
      currency: project.currency,
      location: project.location,
      targetBeneficiaryCount: project.targetBeneficiaryCount,
      actualBeneficiaryCount: project.actualBeneficiaryCount,
      managerId: project.managerId,
      sponsorId: project.sponsorId,
      tags: project.tags,
      metadata: project.metadata,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}

/**
 * Goal DTO Mapper
 */
export class GoalDtoMapper {
  static toDto(goal: Goal): GoalDetailDto {
    return {
      id: goal.id,
      projectId: goal.projectId,
      title: goal.title,
      description: goal.description,
      targetValue: goal.targetValue,
      targetUnit: goal.targetUnit,
      currentValue: goal.currentValue,
      deadline: goal.deadline,
      priority: goal.priority,
      status: goal.status,
      weight: goal.weight,
      dependencies: goal.dependencies,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
  }
}

/**
 * Activity DTO Mapper
 */
export class ActivityDtoMapper {
  static toDto(activity: Activity): ActivityDetailDto {
    return {
      id: activity.id,
      projectId: activity.projectId,
      name: activity.name,
      description: activity.description,
      scale: activity.scale,
      type: activity.type,
      status: activity.status,
      priority: activity.priority,
      startDate: activity.startDate,
      endDate: activity.endDate,
      actualStartDate: activity.actualStartDate,
      actualEndDate: activity.actualEndDate,
      location: activity.location,
      venue: activity.venue,
      assignedTo: activity.assignedTo,
      organizerId: activity.organizerId,
      parentActivityId: activity.parentActivityId,
      expectedParticipants: activity.expectedParticipants,
      actualParticipants: activity.actualParticipants,
      estimatedCost: activity.estimatedCost,
      actualCost: activity.actualCost,
      currency: activity.currency,
      tags: activity.tags,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  }
}

/**
 * Milestone DTO Mapper
 */
export class MilestoneDtoMapper {
  static toDto(milestone: Milestone): MilestoneDetailDto {
    return {
      id: milestone.id,
      projectId: milestone.projectId,
      name: milestone.name,
      description: milestone.description,
      targetDate: milestone.targetDate,
      actualDate: milestone.actualDate,
      status: milestone.status,
      importance: milestone.importance,
      dependencies: milestone.dependencies,
      notes: milestone.notes,
      createdAt: milestone.createdAt,
      updatedAt: milestone.updatedAt,
    };
  }
}

/**
 * Project Team Member DTO Mapper
 */
export class ProjectTeamMemberDtoMapper {
  static toDto(member: ProjectTeamMember): ProjectTeamMemberDetailDto {
    return {
      id: member.id,
      projectId: member.projectId,
      userId: member.userId,
      role: member.role,
      responsibilities: member.responsibilities,
      startDate: member.startDate,
      endDate: member.endDate,
      hoursAllocated: member.hoursAllocated,
      isActive: member.isActive,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  }
}

/**
 * Beneficiary DTO Mapper
 */
export class BeneficiaryDtoMapper {
  static toDto(beneficiary: Beneficiary): BeneficiaryDetailDto {
    return {
      id: beneficiary.id,
      projectId: beneficiary.projectId,
      name: beneficiary.name,
      type: beneficiary.type,
      gender: beneficiary.gender,
      age: beneficiary.age,
      dateOfBirth: beneficiary.dateOfBirth,
      contactNumber: beneficiary.contactNumber,
      email: beneficiary.email,
      address: beneficiary.address,
      location: beneficiary.location,
      category: beneficiary.category,
      enrollmentDate: beneficiary.enrollmentDate,
      exitDate: beneficiary.exitDate,
      status: beneficiary.status,
      benefitsReceived: beneficiary.benefitsReceived,
      notes: beneficiary.notes,
      metadata: beneficiary.metadata,
      createdAt: beneficiary.createdAt,
      updatedAt: beneficiary.updatedAt,
    };
  }
}

/**
 * Project Risk DTO Mapper
 */
export class ProjectRiskDtoMapper {
  static toDto(risk: ProjectRisk): ProjectRiskDetailDto {
    return {
      id: risk.id,
      projectId: risk.projectId,
      title: risk.title,
      description: risk.description,
      category: risk.category,
      severity: risk.severity,
      probability: risk.probability,
      status: risk.status,
      impact: risk.impact,
      mitigationPlan: risk.mitigationPlan,
      ownerId: risk.ownerId,
      identifiedDate: risk.identifiedDate,
      resolvedDate: risk.resolvedDate,
      notes: risk.notes,
      createdAt: risk.createdAt,
      updatedAt: risk.updatedAt,
    };
  }
}

