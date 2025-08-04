import React from "react";
import Divider from "@mui/material/Divider";
import { styled } from "@mui/material/styles";

const CustomDivider = styled(Divider)(({ theme }) => ({
  color: "white",
  width: "300px", 
  borderColor: "#444", 
  fontSize: "0.9rem",
  fontWeight: 500,
  [theme.breakpoints.down("sm")]: {
      width: "265px", 
    },
  "&::before, &::after": {
    borderColor: "#444",
  },
  
  margin: `${theme.spacing(3)} 0`,
}));

function DividerCenter() {
  return <CustomDivider textAlign="center">OR</CustomDivider>;
}

export default DividerCenter;
