import uvicorn

from settings import BASE_DIR

uvicorn_options = {
        "app": "server.asgi:application",
        "host": "127.0.0.1",
        "port": 8001,
        "lifespan": "off",
        "reload": True,
        "reload_dirs": [
            BASE_DIR / 'dev',
            BASE_DIR / 'apps' / 'authentication'
        ]
    }

if __name__ == '__main__':
    uvicorn.run(**uvicorn_options)
