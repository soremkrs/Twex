import React from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@mui/material";

function CreateAccountModal() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1);
  };

  const handleSubmit = () => {
    navigate("/home");
  };

  return (
    <Dialog open onClose={handleClose}>
      <DialogTitle>Create your account</DialogTitle>
      <DialogContent>
        <TextField label="Name" fullWidth margin="dense" />
        <TextField label="Email" fullWidth margin="dense" />
        <TextField label="Date of Birth" fullWidth margin="dense" />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateAccountModal;