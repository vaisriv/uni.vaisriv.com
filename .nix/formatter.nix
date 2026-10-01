{ pkgs, inputs, ... }:
inputs.treefmt-nix.lib.mkWrapper pkgs {
    projectRootFile = "flake.nix";

    # nix
    programs.deadnix.enable = true;
    programs.nixfmt = {
        enable = true;
        indent = 4;
        strict = true;
    };

    # js
    programs.prettier = {
        enable = true;
        settings = {
            tabWidth = 4;
        };
    };

    settings.formatter.prettier = {
        excludes = [
            "notes/*"
            "content/*"
            "package-lock.json"
        ];
    };
}
