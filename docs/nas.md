# NAS Configuration

## ZFS

### Mirrored Zpool

1. Create initial pool and set configuration

    ```sh
    sudo zpool create -o ashift=12 -f pluto mirror \
        /dev/disk/by-id/scsi-SATA_WDC_WD161KRYZ-01_2PGD6KMJ \
        /dev/disk/by-id/scsi-SATA_WDC_WD161KRYZ-01_2PH6SN5J
    sudo zfs set atime=off pluto
    sudo zfs set compression=lz4 pluto
    ```

### Datasets

1. Create datasets

    ```sh
    sudo zfs create pluto/apps
    sudo zfs create pluto/apps/minio
    sudo zfs create pluto/media
    ```

2. Share dataset over NFS

    ```sh
    sudo zfs set \
        sharenfs="no_subtree_check,all_squash,anonuid=568,anongid=100,rw=@192.168.1.0/24,rw=@10.0.42.0/24,rw=@10.10.10.0/24" \
        pluto/media
    sudo zfs set \
        sharenfs="no_subtree_check,all_squash,anonuid=568,anongid=100,rw=@192.168.1.0/24,rw=@10.0.42.0/24,rw=@10.10.10.0/24" \
        pluto/apps/minio
    ```

3. Dataset Permissions

    ```sh
    sudo chmod 770 /pluto/media
    sudo chown -R twitlin:users /pluto/media
    ```

### Snapshots

1. Add or replace the file `/etc/sanoid/sanoid.conf`

    ```ini
    [pluto/media]
    use_template = media

    [template_media]
    frequently = 0
    hourly = 0
    daily = 7
    monthly = 0
    yearly = 0
    autosnap = yes
    autoprune = yes
    ```

2. Start and enable sanoid

    ```sh
    sudo systemctl enable --now sanoid.timer
    ```

3. Give a local user access to a specific datasets snapshots

    ```sh
    sudo zfs allow -u jeff send,snapshot,hold pluto/media
    ```

## NFS

### Local NFS Shares

1. Add or replace file `/etc/exports.d/local.exports`

    ```text
    /share/pvcs 192.168.1.0/24(sec=sys,rw,no_subtree_check,all_squash,anonuid=568,anongid=100)
    /share/pvcs 192.168.42.0/24(sec=sys,rw,no_subtree_check,all_squash,anonuid=568,anongid=100)
    ```

2. Dataset Permissions

    ```sh
    sudo chmod 770 /share/pvcs
    sudo chown -R twitlin:users /share/pvcs
    ```

3. Reload exports

    ```sh
    sudo exportfs -arv
    ```

## Misc

### Badblocks

```sh
sudo badblocks -b 4096 -wsv /dev/disk/by-id/scsi-SATA_ST12000VN0007-2G_ZJV01MC5
```
