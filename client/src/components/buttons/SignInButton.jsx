import React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";

const CustomButton = styled(Button)({
  fontSize: "1.025rem",
  fontWeight: "525",
  width: "300px",
  padding: "5px 0px",
  backgroundColor: "black",
  border: "1px solid #4A99E9",
  color: "#4A99E9",
  borderRadius: "30px",
  textTransform: "none",
  "&:hover": {
      backgroundColor: "#4A99E9",
      color: "white",
  },
});

function SignInButton(props) {
  return (
    <CustomButton onClick={props.onClick} variant="contained">
      Sign in
    </CustomButton>
  );
}

export default SignInButton;
