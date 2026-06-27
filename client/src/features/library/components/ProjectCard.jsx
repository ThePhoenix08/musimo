"use client";

import Image from "../../../assets/Images/library.jpg";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Music, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { IconLoader2 } from "@tabler/icons-react";

import { toast } from "react-toastify";
import { useDeleteProjectByIdMutation } from "../actions/project.api";

export default function ProjectCard({
  project,
  onDelete,
  onOpen,
  isDeleting = false,
}) {
  const [deleteProject, { isLoading }] = useDeleteProjectByIdMutation();

  const handleDelete = async () => {
    try {
      await deleteProject({ projectId: project.id }).unwrap();
      toast.success("Project deleted successfully", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } catch (error) {
      toast.error("Failed to delete project", {
        position: "top-right",
        autoClose: 1000,
        theme: "dark",
      });
      console.error(error);
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105">
      {/* Image Container */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-accent to-background">
        <img
          src={Image}
          alt={project.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            const img = e.target;
            img.src = "/default-project-image.png";
          }}
        />
        {/* Music Badge */}
        <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium shadow-md">
          <Music size={14} />
          <span>Music</span>
        </div>
      </div>

      {/* Card Header */}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold truncate text-balance">
              {project.name}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {project.createdAt
                ? new Date(project.createdAt).toLocaleDateString()
                : "Recently created"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Card Content */}
      <CardContent>
        <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
          {project.description ||
            "Analyze and explore your music with advanced analytics"}
        </p>
      </CardContent>

      {/* Card Footer */}
      <CardFooter className="flex gap-2 pt-2 border-t border-border/40">
        <Button
          className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
          size="sm"
          asChild
        >
          <Link to={`/app/projects/${project.id}`}>
            Open <ArrowRight size={16} />
          </Link>
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isLoading}
          className="bg-destructive cursor-pointer text-destructive-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
        >
          {isLoading && <IconLoader2 className="animate-spin" />}
          Delete
          <Trash2 size={16} />
        </Button>
      </CardFooter>
    </Card>
  );
}
