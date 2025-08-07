import React from "react";
import muiCSS from "@/styles/mui/add-button.module.css"
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import {Box, createTheme, ThemeProvider, Typography} from "@mui/material";

const AddButton = ({onclick, text}) => {
    const theme = createTheme({
          palette: {
            primary: {
              main: '#ffffff',
            },
          },
        });

    if (typeof onclick !== "function")
        onclick = undefined;

    const onClick = (e, ...args) => {
        if (!onclick)
            return;

        onclick(e, ...args);
    }

    return (
          <ThemeProvider theme={theme}>
              <Box className={muiCSS["MuiBox-root"]} sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}>
                  <Fab className={muiCSS["MuiFab-root"]}
                       size="small"
                       color="primary"
                       aria-label="add"
                       onClick={onClick}>
                    <AddIcon />
                  </Fab>
                  <Typography className={muiCSS["MuiTypography-root"]} variant="caption" sx={{ marginTop: "2px" }}>
                      {text}
                  </Typography>
              </Box>
          </ThemeProvider>
    );
}

export default AddButton;