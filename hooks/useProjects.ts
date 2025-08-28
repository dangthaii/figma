import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/axios";

export interface Project {
  id: string;
  name: string;
}

export function useProjects() {
  const queryClient = useQueryClient();

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await axiosClient.get("/projects");
      return res.data.data || [];
    },
  });

  const createProject = useMutation({
    mutationFn: async (data: { name: string; figmaLink: string }) => {
      const res = await axiosClient.post("/projects", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return {
    projects,
    createProject,
  };
}
