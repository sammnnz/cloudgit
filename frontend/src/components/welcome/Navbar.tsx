import { NavbarMui } from "@/components/common/NavbarMui";

const Navbar = () => {
    const links = {
        'Product': {},
        'Platform': {
            href: undefined,
            links: {
                'Storage': {},
                'CI/CD': {},
                'CLI': {}
            }
        },
        'Pricing': {
            href: undefined,
            links: {
                'Free': {},
                'Premium': {},
                'Ultimate': {}
            }
        },
        'About': {},
    };

    return (
        <NavbarMui links={links} variant="default" />
    );
}

export default Navbar;
