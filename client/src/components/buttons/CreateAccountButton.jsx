import React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";

const CustomButton = styled(Button)({
  fontSize: "1.025rem",
  fontWeight: "525",
  width: "300px",
  gap: "10px",
  padding: "5px 0px",
  backgroundColor: "#4A99E9",
  color: "white",
  borderRadius: "30px",
  textTransform: "none",
  "&:hover": {
      backgroundColor: "#2f8ceb",
  },
});

function CreateAccountButton(props) {
  return (
    <CustomButton onClick={props.onClick} variant="contained">
      Create account
    </CustomButton>
  );
}

export default CreateAccountButton;
