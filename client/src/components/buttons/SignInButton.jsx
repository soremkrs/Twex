import React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";

const CustomButton = styled(Button)({
  fontSize: "1.025rem",
  fontWeight: "525",
  width: "300px",
  gap: "10px",
  padding: "5px 0px",
  backgroundColor: "white",
  color: "#4A99E9",
  borderRadius: "30px",
  textTransform: "none",
  "&:hover": {
      backgroundColor: "#EEEEEE",
  },
});

function SignInButton() {
  return (
    <CustomButton variant="contained">
      Sign in
    </CustomButton>
  );
}

export default SignInButton;
