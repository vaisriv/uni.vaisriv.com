{
    description = "uni-notes website flake";

    inputs = {
        # nixpkgs
        nixpkgs.url = "github:nixos/nixpkgs/release-26.05";

        # flake tools (thanks numtide)
        blueprint = {
            url = "github:numtide/blueprint";
            inputs.nixpkgs.follows = "nixpkgs";
        };
        devshell = {
            url = "github:numtide/devshell";
            inputs.nixpkgs.follows = "nixpkgs";
        };
        treefmt-nix = {
            url = "github:numtide/treefmt-nix";
            inputs.nixpkgs.follows = "nixpkgs";
        };
    };

    outputs =
        inputs:
        inputs.blueprint {
            inherit inputs;
            prefix = "./.nix/";
        };
}
