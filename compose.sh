#!/usr/bin/env bash

source ./compose/.env

if [[ "$1" == "-keygen" ]]; then
  # Generate storage keys
  mkdir -p ./_ssh/storage_keys
  EMAIL=$CLOUDGIT_EMAIL KEY_NAME=$STORAGE_1_NAME KEY_TYPE=ed25519 KEY_PATH=./_ssh/storage_keys ./storages/utils/keygen.sh
  EMAIL=$CLOUDGIT_EMAIL KEY_NAME=$STORAGE_2_NAME KEY_TYPE=ed25519 KEY_PATH=./_ssh/storage_keys ./storages/utils/keygen.sh

  # Generate host keys for ssh proxy server
  mkdir -p ./_ssh/sshproxy_host_keys
  EMAIL=$CLOUDGIT_EMAIL KEY_NAME=ssh_host_ed25519_key KEY_TYPE=ed25519 KEY_PATH=./_ssh/sshproxy_host_keys ./storages/utils/keygen.sh
  EMAIL=$CLOUDGIT_EMAIL KEY_NAME=ssh_host_rsa_key KEY_TYPE=rsa KEY_PATH=./_ssh/sshproxy_host_keys ./storages/utils/keygen.sh
  EMAIL=$CLOUDGIT_EMAIL KEY_NAME=ssh_host_ecdsa_key KEY_TYPE=ecdsa KEY_PATH=./_ssh/sshproxy_host_keys ./storages/utils/keygen.sh

  chmod 755 -R ./_ssh
  shift
fi

type=$1
action=$2
shift
shift

# Run
docker compose -f compose/compose."$type".yml "$action" "$@"
