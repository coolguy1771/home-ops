#!/usr/bin/env bash

#
# DANCE
#

while true; do
    figlet -f slant "all" | lolcat
    kubecolor get po -A; sleep 5; clear;
    figlet -f slant "auth" | lolcat
    kubecolor get po -n auth; sleep 5; clear;
    figlet -f slant "calico" | lolcat
    kubecolor get po -n calico-system; sleep 5; clear;
    figlet -f slant "default" | lolcat
    kubecolor get po -n default; sleep 5; clear;
    kubecolor get po -n calico-system; sleep 5; clear;
    figlet -f slant "kube-system" | lolcat
    kubecolor get po -n kube-system; sleep 5; clear;
    figlet -f slant "media" | lolcat
    kubecolor get po -n media; sleep 5; clear;
    figlet -f slant "monitoring" | lolcat
    kubecolor get po -n monitoring; sleep 5; clear;
    figlet -f slant "networking" | lolcat
    kubecolor get po -n networking; sleep 5; clear;
    figlet -f slant "tools" | lolcat
    kubecolor get po -n tools; sleep 5; clear;
    figlet -f slant "velero" | lolcat
    kubecolor get po -n velero; sleep 5; clear;
    figlet -f slant "cert-manager" | lolcat
    kubecolor get po -n cert-manager; sleep 5; clear;
    figlet -f slant "rook-ceph" | lolcat
    kubecolor get po -n rook-ceph; sleep 5; clear;
    figlet -f slant "nodes" | lolcat
    kubecolor get nodes; sleep 5; clear;
done
