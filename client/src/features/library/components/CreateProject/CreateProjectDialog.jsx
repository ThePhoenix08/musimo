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

function CreateProjectDialog({ open, changeView, children }) {
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
        <div className="main-content grid-cols-2">
          <div className="audio-upload-box w-1/2 h-96">
            <AudioUploadCard />
          </div>
          <div className="right w-1/2"></div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default CreateProjectDialog;
