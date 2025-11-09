import { Prisma } from "generated/prisma";

export namespace WorkflowPersistence {
  export type Full = Prisma.WorkflowInstanceGetPayload<{
    include: {
      initiatedBy: true;
      initiatedFor: true;
      steps: {
        include: {
          tasks: {
            include: {
              assignments: {
                include: {
                  assignedTo: true;
                };
              };
            };
          };
        };
      };
    };
  }>;
  export type WithOnlySteps = Prisma.WorkflowInstanceGetPayload<{
    include: {
      steps: true;
      initiatedBy : true;
      initiatedFor : true;
    };
  }>;
  export type Basic = Prisma.WorkflowInstanceGetPayload<{
    include: {};
  }>;


}