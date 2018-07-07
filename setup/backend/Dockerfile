FROM keymetrics/pm2:latest-alpine
ENV NPM_CONFIG_LOGLEVEL error
ARG GIT_BRANCH=master

RUN mkdir /app
RUN mkdir /data
RUN mkdir /data/config
RUN mkdir /data/files
RUN echo "[Setup SSH Server]" \
 && apk update \
 && apk add openssh bash git mc make gcc g++ python build-base \
 && echo "[/Setup SSH Server]"
RUN echo "[Create deployer user]" \
 && adduser deployer -g "" -D \
 && echo "deployer:deployer" | chpasswd \
 echo "[/Create deployer user]"
COPY ssh/id_rsa /home/deployer/.ssh/id_rsa
COPY ssh/id_rsa.pub /home/deployer/.ssh/id_rsa.pub
RUN  echo "[Setup .ssh]" \
 && chown deployer:deployer /home/deployer/.ssh/id_rsa \
 && chown deployer:deployer /home/deployer/.ssh/id_rsa.pub \
 && chmod 600 /home/deployer/.ssh/id_rsa \
 && chmod 600 /home/deployer/.ssh/id_rsa.pub \
 && chown deployer:deployer /app \
 && touch /home/deployer/.ssh/known_hosts \
 && ssh-keyscan -t rsa github.com >> /home/deployer/.ssh/known_hosts \
 && ssh-keyscan -t rsa bitbucket.org >> /home/deployer/.ssh/known_hosts \
 && chmod 700 /home/deployer/.ssh \
 && chown -R deployer:deployer /home/deployer/.ssh \
 && echo "[/Setup .ssh]"

USER deployer
RUN /bin/bash -c "eval '$(ssh-agent -s)'; ssh-add /home/deployer/.ssh/id_rsa"
RUN echo "[Checkout & build the app]" \
 && cd /app \
 && git clone -b $GIT_BRANCH --single-branch https://github.com/ChronoBank/LaborX-backend.git \
 && cd LaborX-backend \
 && git log -1 \
 && echo "LaborX-backend/package.json" \
 && cat package.json \
 && yarn --no-lockfile \
 && echo "[/Checkout & build the app]"
RUN echo "[Link config files]" \
 && rm -f /app/LaborX-backend/ecosystem.config.js \
 && rm -rf /app/LaborX-backend/config \
 && ln -s /data/config/config /app/LaborX-backend/config \
 && ln -s /data/config/ecosystem.config.js /app/LaborX-backend/ecosystem.config.js \
 && echo "[/Link config files]"

EXPOSE 3000

VOLUME /data/config /data/files

WORKDIR /app/LaborX-backend

CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
