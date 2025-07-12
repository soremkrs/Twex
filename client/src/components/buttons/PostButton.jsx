import React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";

const CustomButton = styled(Button)({
  fontSize: "1.2rem",
  fontWeight: "525",
  width: "auto",
  padding: "10px 0px",
  backgroundColor: "white",
  color: "black",
  borderRadius: "30px",
  textTransform: "none",
  "&:hover": {
      backgroundColor: "#4A99E9",
      color: "white",
  },
});

function PostButton(props) {
  return (
    <CustomButton onClick={props.onClick} variant="contained">
      Post
    </CustomButton>
  );
}

export default PostButton;
