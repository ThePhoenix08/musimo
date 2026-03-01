import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { AudioUploadCard } from "@/components/audio-upload-card.jsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  CREATE_PROJECT_SCHEMA,
  AUDIO_FILE_SCHEMA,
} from "@/features/library/project.validator.js";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import SmartImage from "@/components/misc/SmartImage";
import RIGHT_SECTION_BG_IMG from "@/assets/Images/create_project_Side.jpg?w=400;800;1200;1600&format=webp&imagetools&as=picture&metadata";

function CreateProjectDialog({ open, changeView, children }) {
  const form = useForm({
    resolver: zodResolver(CREATE_PROJECT_SCHEMA),
    defaultValues: {
      title: "",
      description: "",
    },
    mode: "onChange",
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  function handleSubmit(data) {
    const payload = new FormData();
    payload.append("title", data.title);
    payload.append("description", data.description);
    payload.append("main-audio", uploadedFile, uploadedFile.name);

    // console.debug(Object.fromEntries(payload.entries()));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) changeView("all");
      }}
    >
      {children}
      <DialogContent className="sm:max-w-md lg:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Create new Project</DialogTitle>
          <DialogDescription>
            Upload audio and enter project title and description to start a new
            project to analyse the audio.
          </DialogDescription>
        </DialogHeader>
        <div className="main-content flex gap-4">
          <div className="left w-1/2 flex flex-col gap-4">
            <div className="form">
              <CreateProjectForm form={form} onSubmit={handleSubmit} />
            </div>
            <div className="audio-upload-box grow flex flex-col">
              <FieldLabel htmlFor="create-project-form-audio-upload">
                Project Title
              </FieldLabel>
              <AudioUploadCard
                id="create-project-form-audio-upload"
                className="grow py-2"
                uploadedFile={uploadedFile}
                setUploadedFile={setUploadedFile}
                schema={AUDIO_FILE_SCHEMA}
              />
            </div>
          </div>
          <Separator orientation="vertical" />
          <div className="right w-1/2">
            <SmartImage
              image={RIGHT_SECTION_BG_IMG}
              alt="audio analysis project creation image"
              className="border-2 rounded-md"
            />
          </div>
        </div>
        <DialogFooter className="flex gap-4 w-full sm:justify-evenly">
          <Button
            className="w-1/2"
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Reset
          </Button>
          <Button
            className="w-1/2"
            type="submit"
            form="create-project-form"
            disabled={!form.formState.isValid || !uploadedFile}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default CreateProjectDialog;

const CreateProjectForm = ({ form, onSubmit }) => {
  return (
    <form
      className=""
      id="create-project-form"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup className="flex flex-col gap-4">
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="create-project-form-title">
                Project Title
              </FieldLabel>
              <Input
                {...field}
                id="create-project-form-title"
                aria-invalid={fieldState.invalid}
                placeholder="Enter your project title"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="create-project-form-description">
                Project Description
              </FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  {...field}
                  id="create-project-form-description"
                  placeholder="Enter project description."
                  rows={8}
                  className="min-h-24 resize-none"
                  aria-invalid={fieldState.invalid}
                />
                <InputGroupAddon align="block-end">
                  <InputGroupText className="tabular-nums">
                    {field.value.length}/150 characters
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
};
