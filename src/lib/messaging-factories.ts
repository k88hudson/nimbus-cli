interface Message {
  id: string;
  template: string;
  [key: string]: unknown;
}

export function messagingSystemFactory(
  slug: string,
  branch: string,
  template: string,
  props: any
) {
  return {
    id: `${slug}:${branch}`,
    template,
    ...props,
  };
}

export const factories: {
  [featureId: string]: (slug: string, branch: string) => Message;
} = {
  cfr(slug: string, branch: string) {
    return messagingSystemFactory(slug, branch, "cfr_doorhanger", {
      trigger: {
        id: "TODO",
      },
      frequency: {
        lifetime: 3,
      },
      priority: 1,
      content: {
        bucket_id: `${slug}:${branch}`,
      },
    });
  },

  moments(slug: string, branch: string) {
    return messagingSystemFactory(slug, branch, "update_action", {
      groups: ["moments-pages"],
      trigger: { id: "momentsUpdate" },
      content: {
        bucket_id: `${slug}:${branch}`,
        action: {
          id: "moments-wnp",
          data: {
            expireDelta: 604800000,
            url: "TODO MOMENTS URL",
          },
        },
      },
    });
  },

  aboutwelcome: (slug: string, branch: string) => {
    return messagingSystemFactory(slug, branch, "multistage", {
      id: `aw-${branch}`,
      screens: [],
    });
  },
};
