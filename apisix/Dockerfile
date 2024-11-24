FROM apache/apisix:${APISIX_IMAGE_TAG:-3.11.0-debian}

USER root

ARG APISIX_ADMIN_API_HOST
ARG APISIX_ADMIN_API_PASSWORD

# Install wget and clean up to reduce image size
RUN apt-get update && \
    apt-get install -y wget curl gettext && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN wget https://github.com/api7/adc/releases/download/v0.2.0/adc_0.2.0_linux_amd64.tar.gz && \
    tar -zxvf adc_0.2.0_linux_amd64.tar.gz && \
    mv adc /usr/local/bin/adc

RUN echo "$APISIX_ADMIN_API_HOST" > /tmp/adc_input && \
    echo "$APISIX_ADMIN_API_PASSWORD" >> /tmp/adc_input && \
    adc configure < /tmp/adc_input && \
    rm -f /tmp/adc_input

WORKDIR /usr/local/apisix/conf

ENTRYPOINT ["/bin/sh", "entrypoint.sh"]