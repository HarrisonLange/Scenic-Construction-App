FROM caddy:2.10.2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
RUN caddy fmt --overwrite /etc/caddy/Caddyfile
RUN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

COPY . /srv
RUN rm /srv/Caddyfile
