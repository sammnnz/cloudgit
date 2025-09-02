#!/usr/bin/env bash
if [ ! -f $KEY_PATH/$KEY_NAME ] && [ ! -f $KEY_PATH/$KEY_NAME.pub ]; then
  ssh-keygen -t $KEY_TYPE -C "$EMAIL" -f $KEY_PATH/$KEY_NAME -N ""
  echo "SSH key generated."
else
  echo "SSH key already exists."
fi