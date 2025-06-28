import React from "react";
import { styled } from "@mui/material/styles";
import { Box, Typography, IconButton, Link } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

// Styled Footer Wrapper
const FooterContainer = styled(Box)(({ theme }) => ({
  color: "#aaa",
  padding: theme.spacing(3),
  marginTop: "auto",
  textAlign: "center",
}));

// Styled icon buttons
const SocialIcons = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  display: "flex",
  justifyContent: "center",
  gap: theme.spacing(2),
}));

function Footer() {
  return (
    <FooterContainer component="footer">
      <Typography variant="body2">
        © {new Date().getFullYear()} Twex. Built by SoremOne
      </Typography>
      <SocialIcons>
        <IconButton
          component={Link}
          href="https://github.com/soremkrs"
          target="_blank"
          rel="noopener"
          aria-label="GitHub"
          sx={{ color: "#aaa" }}
        >
          <GitHubIcon />
        </IconButton>
        <IconButton
          component={Link}
          href="https://www.linkedin.com/in/filippmian"
          target="_blank"
          rel="noopener"
          aria-label="LinkedIn"
          sx={{ color: "#aaa" }}
        >
          <LinkedInIcon />
        </IconButton>
      </SocialIcons>
    </FooterContainer>
  );
}

export default Footer;