import React from "react";
import {
    AppBar,
    Toolbar,
    Box,
    Button,
    IconButton,
    Avatar,
    Stack,
    Paper,
    Popper,
    MenuItem,
    MenuList,
    Grow,
} from "@mui/material";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import iconAvatarDefault from "@static/img/icon-avatar-default.svg";
import logoVariant from "@static/img/logo-variant.svg";

interface NavbarLink {
    href?: string;
    links?: Record<string, NavbarLink>;
}

interface NavbarProps {
    links?: Record<string, NavbarLink>;
    showLogo?: boolean;
    variant?: "default" | "account";
}

interface MenuWithLinksProps {
    label: string;
    link?: string;
    sublinks?: Record<string, NavbarLink>;
}

const MenuWithLinks: React.FC<MenuWithLinksProps> = ({ label, link, sublinks }) => {
    const navigate = useNavigate();
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLButtonElement>(null);

    const sublinkEntries = sublinks ? Object.entries(sublinks) : [];
    const hasSublinks = sublinkEntries.length > 0;

    const handleNavigate = (url?: string) => {
        if (url) {
            navigate(url);
        }
        setOpen(false);
    };

    const handleMouseEnter = () => {
        if (hasSublinks) {
            setOpen(true);
        }
    };

    const handleMouseLeave = () => {
        setOpen(false);
    };

    const handleClick = () => {
        if (link) {
            handleNavigate(link);
        } else if (hasSublinks) {
            setOpen(true);
        }
    };

    return (
        <Box
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            sx={{ position: 'relative' }}
        >
            <Button
                ref={anchorRef}
                color="inherit"
                onClick={handleClick}
                sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    color: "#959595",
                    borderRadius: 0,
                    padding: '0 10px',
                    height: 50,
                    "&:hover": {
                        color: "#000000",
                        backgroundColor: 'transparent',
                    },
                }}
            >
                {label}
            </Button>

            {hasSublinks && (
                <Popper
                    open={open}
                    anchorEl={anchorRef.current}
                    placement="bottom-start"
                    transition
                    disablePortal
                    sx={{ zIndex: 1300 }}
                >
                    {({ TransitionProps, placement }) => (
                        <Grow
                            {...TransitionProps}
                            style={{ transformOrigin: placement === 'bottom-start' ? 'top left' : 'top right' }}
                        >
                            <Paper
                                onMouseEnter={() => setOpen(true)}
                                onMouseLeave={() => setOpen(false)}
                                sx={{
                                    minWidth: 200,
                                    boxShadow: "0 4px 12px 0 rgb(0 0 0 / 8%)",
                                    borderRadius: "4px",
                                    p: 1.5,
                                    mt: 0.5,
                                }}
                            >
                                <MenuList>
                                    {sublinkEntries.map(([subLabel, subLink]) => (
                                        <MenuItem
                                            key={subLabel}
                                            onClick={() => handleNavigate(subLink.href)}
                                            sx={{
                                                fontWeight: 600,
                                                fontSize: "12px",
                                                color: "#959595",
                                                py: 1,
                                                mb: sublinkEntries[sublinkEntries.length - 1][0] === subLabel ? 0 : 1,
                                                minHeight: 'auto',
                                                "&:hover": {
                                                    color: "#49A7CC",
                                                    bgcolor: "rgba(73, 167, 204, 0.05)",
                                                },
                                            }}
                                        >
                                            {subLabel}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </Paper>
                        </Grow>
                    )}
                </Popper>
            )}
        </Box>
    );
};

export const NavbarMui: React.FC<NavbarProps> = ({ 
    links = {}, 
    showLogo = true,
    variant = "default" 
}) => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading, logout, error } = useAuth();

    const handleLogout = async () => {
        try {
            const response = await logout();
            if (response.success) {
                navigate(window.location.href);
            }
        } catch {
            alert(error ?? "Logout failed. Please try again.");
        }
    };

    const handleNavigate = (url: string) => {
        navigate(url);
    };

    const isAccountVariant = variant === "account";

    const authButtons = (
        <Stack direction="row" spacing={1} alignItems="center">
            <Button
                onClick={handleLogout}
                disabled={isLoading}
                sx={{
                    color: "#000000",
                    border: "1px solid #000000",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "12px",
                    py: 0.75,
                    px: 1.5,
                    "&:hover": {
                        borderColor: "#49A7CC",
                        color: "#49A7CC",
                    },
                    "&.Mui-disabled": {
                        opacity: 0.6,
                    },
                }}
            >
                {isLoading ? "Logout..." : "Logout"}
            </Button>
            <IconButton
                onClick={() => handleNavigate(`/account/${user.username}`)}
                sx={{
                    p: 0,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1px solid #000000",
                }}
            >
                <Avatar
                    src={iconAvatarDefault}
                    sx={{
                        width: 26,
                        height: 26,
                        bgcolor: "#e0e0e0",
                    }}
                />
            </IconButton>
        </Stack>
    );

    const noAuthButtons = (
        <Stack direction="row" spacing={1}>
            <Button
                href="/signin"
                sx={{
                    color: "#000000",
                    border: "1px solid #000000",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "12px",
                    py: 0.75,
                    px: 1.5,
                    "&:hover": {
                        borderColor: "#49A7CC",
                        color: "#49A7CC",
                    },
                }}
            >
                Sign in
            </Button>
            <Button
                href="/signup"
                variant="contained"
                sx={{
                    bgcolor: "#000000",
                    color: "#ffffff",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "12px",
                    py: 0.75,
                    px: 1.5,
                    "&:hover": {
                        bgcolor: "#49A7CC",
                    },
                }}
            >
                Sign up
            </Button>
        </Stack>
    );

    const linkEntries = Object.entries(links);
    const linkComponents = linkEntries.map(([label, linkData]) => (
        <MenuWithLinks
            key={label}
            label={label}
            link={linkData.href}
            sublinks={linkData.links}
        />
    ));

    return (
        <AppBar
            position="static"
            elevation={0}
            sx={{
                height: 50,
                bgcolor: isAccountVariant 
                    ? "linear-gradient(90deg, rgba(255, 255, 255, 1) 20%, #49A7CC 100%)"
                    : "#ffffff",
                background: isAccountVariant
                    ? "linear-gradient(90deg, rgba(255, 255, 255, 1) 20%, #49A7CC 100%)"
                    : undefined,
                borderBottom: "none",
            }}
        >
            <Toolbar
                sx={{
                    minHeight: 50,
                    height: 50,
                    px: "12px !important",
                    display: "flex",
                    justifyContent: "space-between",
                    maxWidth: "100%",
                    width: "100%",
                }}
            >
                {showLogo && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                        }}
                        onClick={() => handleNavigate("/home")}
                    >
                        <img
                            src={logoVariant}
                            alt="Logo"
                            style={{ height: 16 }}
                        />
                    </Box>
                )}

                {linkEntries.length > 0 && (
                    <Box
                        sx={{
                            display: "flex",
                            gap: 0,
                            ml: showLogo ? 3 : 0,
                            flex: 1,
                            alignItems: "center",
                        }}
                    >
                        {linkComponents}
                    </Box>
                )}

                <Box sx={{ display: "flex", alignItems: "center" }}>
                    {isAuthenticated ? authButtons : noAuthButtons}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default NavbarMui;