import { useQuery } from '@tanstack/react-query';
// import your Orval SDK methods here
// import { users_v1_get_listUsers, ... } from '../../../generated/sdk/endpoints';

export function useProjectAnalytics(projectId: number) {
  // Replace with your SDK calls
  return useQuery({
    queryKey: ['analytics', projectId],
    queryFn: async () => {
      // const res = await mySdk.analytics_v1_get_projectAnalytics(projectId);
      // return res.data;
      // TEMP FAKE:
      return {
        totalProjects: 2,
        completedProjects: 0,
        myTasksCount: 3,
        overdueCount: 0,
        projects: [],
        myTasks: [],
        overdue: [],
      };
    },
  });
}


export function useTasksData(/* projectId: number, filters: Filters */) {
  return useQuery({
    queryKey: ['project-tasks', /* projectId, filters */],
    queryFn: async () => {
      // const res = await projects_v1_get_tasks(projectId, filters);
      // return { tasks: res.data.items, teamMembers: res.data.teamCount };
      return { tasks: [], teamMembers: 1 }; // temp
    }, 
  
  });
}
