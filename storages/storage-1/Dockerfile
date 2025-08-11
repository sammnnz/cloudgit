FROM ubuntu:24.04

RUN apt update -y
RUN apt install bash -y

SHELL ["/bin/bash", "-c"]

RUN apt install git -y
RUN apt install openssh-server -y
RUN apt install adduser -y
RUN apt install sudo -y

ARG STORAGE_PATH
ARG USERNAME
ARG PASSWORD

#https://manpages.ubuntu.com/manpages/trusty/ru/man8/adduser.8.html
RUN addgroup --gid 1001 ${USERNAME} && \
    adduser --home /home/${USERNAME} --uid 1001 --gid 1001 ${USERNAME} && \
    adduser ${USERNAME} sudo && \
    # https://www.baeldung.com/linux/username-not-in-sudoers-file
    echo "${USERNAME}	ALL=(ALL:ALL) ALL" >> /etc/sudoers && \
    # https://askubuntu.com/questions/159007/how-do-i-run-specific-sudo-commands-without-a-password
    echo "${USERNAME}	ALL=(ALL:ALL) NOPASSWD: /sbin/sshd" >> /etc/sudoers && \
    echo "PasswordAuthentication no" >> /etc/ssh/sshd_config && \
    echo "PubkeyAuthentication yes" >> /etc/ssh/sshd_config && \
    chmod  0440  /etc/sudoers && \
    echo "${USERNAME}:${PASSWORD}" | chpasswd && \
    mkdir -m 750 -p ${STORAGE_PATH} && \
    chown ${USERNAME}:${USERNAME} ${STORAGE_PATH} && \
    mkdir -m 750 -p /home/${USERNAME}/.ssh && touch /home/${USERNAME}/.ssh/authorized_keys && \
    chown -R ${USERNAME}:${USERNAME} /home/${USERNAME}/.ssh && \
    mkdir -p /run/sshd

WORKDIR /home/${USERNAME}

USER 1001

CMD ["sudo", "/usr/sbin/sshd", "-D"]
#CMD ["sleep", "infinity"]