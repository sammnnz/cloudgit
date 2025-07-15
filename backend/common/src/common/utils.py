""" Utility functions and classes for the backend. """

__all__ = ["ProxyField"]


class ProxyField:
    __slots__ = ('readonly', 'types', 'value')

    def __init__(self, *types, readonly=False):
        self.readonly = readonly
        self.types = types

    def __get__(self, instance, owner):
        return self.value

    def __set__(self, instance, value):
        if not isinstance(value, self.types):
            raise TypeError(f"'${self.types}' types required.")

        if self.readonly and hasattr(self, 'value'):
            raise AttributeError("This field is readonly and cannot be set again.")

        self.value = value

    def __delete__(self, instance):
        if self.readonly:
            raise AttributeError("This field is readonly and cannot be deleted.")

        del self.value
