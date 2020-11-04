using System;
using System.Threading.Tasks;
using Statiq.App;
using Statiq.Common;
using Statiq.Web;

namespace Blog
{
    class Program
    {
        public static async Task<int> Main(string[] args) =>
            await Bootstrapper
                .Factory
                .CreateWeb(args)
                .DeployToGitHubPagesBranch(
                    "stefannikolei",
                    "stefannikolei.github.io",
                    Config.FromSetting<string>("GITHUB_TOKEN"),
                    "main"
                    )
                .RunAsync();
    }
}