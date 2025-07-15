import uvicorn

from settings import BASE_DIR

if __name__ == '__main__':
    uvicorn.run(app="server.asgi:application",
                lifespan="off",
                reload=True,
                reload_dirs=[
                    BASE_DIR / 'dev',
                    BASE_DIR / 'apps' / 'authentication'
                ])
