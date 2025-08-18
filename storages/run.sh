#!/usr/bin/env bash
if [ ! -f ~/.ssh/$CLOUDGIT_STORAGE_NAME ] && [ ! -f ~/.ssh/$CLOUDGIT_STORAGE_NAME.pub ]; then
  ssh-keygen -t ed25519 -C "$CLOUDGIT_EMAIL" -f ~/.ssh/$CLOUDGIT_STORAGE_NAME -N ""
  echo "SSH key generated."
else
  echo "SSH key already exists."
fi