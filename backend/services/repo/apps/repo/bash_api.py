from common.ssh import ssh_exec
from json import loads


async def df_avail(name: str, mnt: str, logs: bool = True) -> int:
    """ Return available size of mount in KB. """
    commands = [
        f"df -h {mnt} --output=avail -k | grep [0-9]"
    ]
    output = await ssh_exec(name=name, commands=commands, logs=logs)
    try:
        number = int(output[-1])
        return number
    except ValueError:
        raise ValueError(f"Unexpected output: {output[-1]}")


async def git_checkout(name: str, path: str, branch: str = 'main', logs: bool = True):
    commands = [
        f"cd {path}",
        f"git checkout {branch}"
    ]
    output = await ssh_exec(name=name, commands=commands, logs=logs)
    return output[-1]


async def git_checkout_and_gdsjson(name: str, path: str, branch: str = 'main', depth: int = -1, logs: bool = True):
    commands = [
        f"cd {path}",
        f"git checkout -b {branch}",
        f"gdsjson `pwd` {depth}"
    ]
    output = await ssh_exec(name=name, commands=commands, logs=logs)
    return loads(output[-1])


async def git_init(name: str, path: str, logs: bool = True):
    commands = [
        f"mkdir -p {path}",
        f"cd {path}",
        "git config --global init.defaultBranch main",
        "git init"
    ]
    output = await ssh_exec(name=name, commands=commands, logs=logs)
    return output[-1]


async def rm(name: str, path: str, logs: bool = True):
    commands = [
        f"rm -r {path}"
    ]
    output = await ssh_exec(name=name, commands=commands, logs=logs)
    return output[-1]
