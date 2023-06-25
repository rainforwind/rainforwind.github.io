###### 背景

2023年3月的某一天，我忽然在想，能不能使用github pages功能搞个静态网站，把[我的博客](https://www.cnblogs.com/rainforwind)迁过来，于是就有了本站。

###### 内容

1. [我在博客园的博客](https://www.cnblogs.com/rainforwind)慢慢迁移，进度随缘。如果有些内容很久都没有迁过来，也可能是因为我觉的价值不大。
2. 今后的博客更新，我会尽可能地优先在放在这里。

###### 联系方式

1. 通过github公开联系，欢迎在[这个issue](https://github.com/rainforwind/rainforwind.github.io/issues/1)下留言。
2. 私下联系，发邮件到`rainforwind@qq.com` （这年头垃圾邮件比较多，如果刚好没看到，请多包涵）。

###### 技术细节

- 作为一个极简主义者，不想依赖“复杂”的模版渲染流程，所以使用自定义的GitHub Actions替换了默认的pages-build-deployment ，删除了其中的build环节（耗时1min+），只保留deploy环节（耗时~10秒）。好处是，部署变快了，本地不依赖模版库也能简单地运行服务。代价是，大部分页面内容的加载和渲染都要放在浏览器端执行，与服务器交互次数增加，整体渲染成本增加，用户体验会偏慢。这是我明确做出的取舍。
