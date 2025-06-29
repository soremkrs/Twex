import React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import GoogleIcon from "../../assets/google-icon.svg";

const CustomButton = styled(Button)({
  fontSize: "1.025rem",
  fontWeight: "525",
  width: "300px",
  gap: "10px",
  padding: "5px 0px",
  backgroundColor: "white",
  color: "black",
  borderRadius: "40px",
  textTransform: "none",
  "&:hover": {
      backgroundColor: "#EEEEEE",
  },
});

function OAuthButton(props) {
  return (
    <CustomButton onClick={props.onClick} variant="contained">
      <img src={GoogleIcon} alt="Google icon" width="25" height="25" /> {props.text}
    </CustomButton>
  );
}

export default OAuthButton;
