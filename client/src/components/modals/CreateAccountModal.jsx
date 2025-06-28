import React from "react";
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@mui/material";

function CreateAccountModal({ open, onClose, onSubmit }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create your account</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="dense" label="Name" fullWidth variant="outlined" />
        <TextField margin="dense" label="Phone or Email" fullWidth variant="outlined" />
        <TextField margin="dense" label="Date of Birth" fullWidth variant="outlined" />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateAccountModal;