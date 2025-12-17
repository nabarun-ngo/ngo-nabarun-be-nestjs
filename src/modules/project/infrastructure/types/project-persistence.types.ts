import { Prisma } from '@prisma/client';

export namespace ProjectPersistence {
  export type Base = Prisma.ProjectGetPayload<{
    include: {
      manager: true;
      sponsor: true;
    };
  }>;
}

export namespace GoalPersistence {
  export type Base = Prisma.GoalGetPayload<{
    include: {
      project: true;
    };
  }>;
}

export namespace ActivityPersistence {
  export type Base = Prisma.ActivityGetPayload<{
    include: {
      project: true;
      assignee: true;
      organizer: true;
      parentActivity: true;
    };
  }>;
}

export namespace MilestonePersistence {
  export type Base = Prisma.MilestoneGetPayload<{
    include: {
      project: true;
    };
  }>;
}

export namespace ProjectTeamMemberPersistence {
  export type Base = Prisma.ProjectTeamMemberGetPayload<{
    include: {
      project: true;
      user: true;
    };
  }>;
}

export namespace BeneficiaryPersistence {
  export type Base = Prisma.BeneficiaryGetPayload<{
    include: {
      project: true;
    };
  }>;
}

export namespace ProjectRiskPersistence {
  export type Base = Prisma.ProjectRiskGetPayload<{
    include: {
      project: true;
      owner: true;
    };
  }>;
}

export namespace ActivityExpensePersistence {
  export type Base = Prisma.ActivityExpenseGetPayload<{
    include: {
      activity: true;
      expense: true;
      creator: true;
    };
  }>;
}

