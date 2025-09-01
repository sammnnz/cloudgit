from pydantic import BaseModel
from typing import Optional


class _UserSSHKey(BaseModel):
    id: int
    username: str


class SSHKeyInSchema(BaseModel):
    id: int
    keyname: str
    sshkey: str
    fingerprint: Optional[str] = None
    user: _UserSSHKey


class StorageInSchema(BaseModel):
    id: int
    name: str
    path: str
    ssh_host: str
    ssh_port: int
    ssh_username: str
