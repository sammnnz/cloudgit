import { NavbarMui } from "@/components/common/NavbarMui";

interface NavbarProps {
    account: { username: string };
    repo: { repo_name: string };
    session: { username: string };
}

const Navbar = ({account, repo, session}: NavbarProps) => {
    const accountUsername = account.username,
        sessionUsername = session.username,
        repoName = repo.repo_name;

    // Only include Settings link if user is viewing their own account
    const shouldShowSettings = accountUsername === sessionUsername;

    const links: Record<string, { href: string }> = {
        'Profile': {
            href: '/account/' + accountUsername + '?tab=profile',
        },
        'Statistics': {
            href: '/account/' + accountUsername + '/' + repoName + '?tab=statistics',
        }
    };

    if (shouldShowSettings) {
        links['Settings'] = {
            href: '/account/' + accountUsername + '/' + repoName + '?tab=settings',
        };
    }

    return (
        <NavbarMui links={links} variant="account" />
    );
}

export default Navbar;
