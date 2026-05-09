import { toast } from "react-toastify";
import { useDeleteProjectByIdMutation } from "../actions/project.api";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconTrash } from "@tabler/icons-react";
import { Link } from "react-router";

const ProjectCard = ({ project }) => {
  const [deleteProject, { isLoading }] = useDeleteProjectByIdMutation();

  const handleDelete = async () => {
    try {
      await deleteProject({ projectId: project.id }).unwrap();
      toast.success("Project deleted successfully");
    } catch (error) {
      toast.error("Failed to delete project");
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <Button asChild>
          <Link to={`/app/projects/${project.id}`}>Open</Link>
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isLoading}
          className="bg-destructive text-destructive-foreground"
        >
          <IconTrash size={16} />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};
export default ProjectCard;
