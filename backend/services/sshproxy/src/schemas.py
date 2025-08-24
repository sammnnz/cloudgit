from pydantic import BaseModel


class StorageInSchema(BaseModel):
    id: int
    name: str
    path: str
    ssh_host: str
    ssh_port: int
    ssh_username: str
